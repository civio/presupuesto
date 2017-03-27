describe("Format a number", function() {

  it("null", function() {
    expect( Formatter.number() ).toEqual( '' );
  });
	
  it("integer", function() {
    expect( Formatter.number( 1980 ) ).toEqual( '1,980' );
  });

  it("decimal", function() {
    expect( Formatter.number( 1980.7234 ) ).toEqual( '1,980' );
  });

  it("big decimal", function() {
    expect( Formatter.number( 198019801980.7234 ) ).toEqual( '198,019,801,980' );
  });

  it("decimal with postfix", function() {
    expect( Formatter.number( 1980.7234, ' €' ) ).toEqual( '1,980 €' );
  });
});


describe("Format an amount", function() {

  it("null", function() {
    expect( Formatter.amount() ).toEqual( '' );
  });

  it("integer", function() {
    expect( Formatter.amount( 1456870 ) ).toEqual( '14,568\xA0€' );
  });

  it("decimal", function() {
    expect( Formatter.amount( 1456870.1234 ) ).toEqual( '14,568\xA0€' );
  });
});


describe("Format a simplified amount", function() {

  it("null", function() {
    expect( Formatter.amountSimplified() ).toEqual( '' );
  });

  it("integer", function() {
    expect( Formatter.amountSimplified( 15687 ) ).toEqual( '156\xA0€' );
  });

  it("decimal", function() {
    expect( Formatter.amountSimplified( 15687.1234 ) ).toEqual( '156\xA0€' );
  });

  it("thousands", function() {
    expect( Formatter.amountSimplified( 1050000 ) ).toEqual( '10\xA0mil\xA0€' );
  });

  it("millions", function() {
    expect( Formatter.amountSimplified( 1070000000 ) ).toEqual( '10\xA0mill.\xA0€' );
  });
});


describe("Format a decimal", function() {

  it("null", function() {
    expect( Formatter.decimal() ).toEqual( '' );
  });

  it("integer", function() {
    expect( Formatter.decimal( 1980 ) ).toEqual( '1,980.00' );
  });

  it("decimal", function() {
    expect( Formatter.decimal( 1980.6254 ) ).toEqual( '1,980.62' );
  });

  it("decimal without digits", function() {
    expect( Formatter.decimal( 1980.6254, 0 ) ).toEqual( '1,980' );
  });

  it("decimal with 1 digit", function() {
    expect( Formatter.decimal( 1980.6254, 1 ) ).toEqual( '1,980.6' );
  });

  it("decimal with 2 digits", function() {
    expect( Formatter.decimal( 1980.6254, 2 ) ).toEqual( '1,980.62' );
  });

  it("decimal with 3 digits", function() {
    expect( Formatter.decimal( 1980.6254, 3 ) ).toEqual( '1,980.625' );
  });
});